import Anthropic from '@anthropic-ai/sdk';
import type {
  AIService,
  AnalyzeFailureInput,
  GenerateBugReportInput,
  GenerateTestCasesInput,
  GeneratedBugContent,
  GeneratedTestCase,
} from './types';
import type { FailureAnalysis } from '@obsidian/shared-types';

const TEST_CASE_TYPES = ['positive', 'negative', 'edge', 'validation'] as const;
const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const GENERATE_TEST_CASES_TOOL: Anthropic.Tool = {
  name: 'submit_test_cases',
  description: 'Submit the generated structured test cases for the requirement.',
  input_schema: {
    type: 'object',
    properties: {
      testCases: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: TEST_CASE_TYPES as unknown as string[] },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  target: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['action'],
              },
            },
            expectedResult: { type: 'string' },
          },
          required: ['title', 'description', 'type', 'steps', 'expectedResult'],
        },
      },
    },
    required: ['testCases'],
  },
};

const ANALYZE_FAILURE_TOOL: Anthropic.Tool = {
  name: 'submit_failure_analysis',
  description: 'Submit the structured analysis of why this test case failed.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'One or two sentence summary of the failure.' },
      expectedBehavior: { type: 'string' },
      actualBehavior: {
        type: 'string',
        description: 'What actually happened, strictly grounded in the evidence provided (error message, screenshot, console log).',
      },
      rootCauseHypothesis: {
        type: 'string',
        description:
          'A plausible root cause. This is always a hypothesis, never a confirmed fact, even if it seems obvious — omit if there is not enough evidence to even guess.',
      },
      confidenceLevel: { type: 'string', enum: CONFIDENCE_LEVELS as unknown as string[] },
      errorCategory: {
        type: 'string',
        description: 'Short category, e.g. "selector not found", "network timeout", "assertion mismatch", "navigation failure".',
      },
      suggestedSeverity: { type: 'string', enum: SEVERITIES as unknown as string[] },
      suggestedPriority: { type: 'string', enum: PRIORITIES as unknown as string[] },
      reproductionSteps: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concrete steps a human could follow to reproduce this, derived from the test case steps.',
      },
    },
    required: [
      'summary',
      'expectedBehavior',
      'actualBehavior',
      'confidenceLevel',
      'errorCategory',
      'suggestedSeverity',
      'suggestedPriority',
      'reproductionSteps',
    ],
  },
};

const GENERATE_BUG_REPORT_TOOL: Anthropic.Tool = {
  name: 'submit_bug_report',
  description: 'Submit a structured bug report ready to send to the bug tracker.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Concise bug title, e.g. "[Checkout] Promo code field rejects valid codes".' },
      description: { type: 'string' },
      severity: { type: 'string', enum: SEVERITIES as unknown as string[] },
      priority: { type: 'string', enum: PRIORITIES as unknown as string[] },
      stepsToReproduce: { type: 'array', items: { type: 'string' } },
      expectedResult: { type: 'string' },
      actualResult: { type: 'string' },
    },
    required: ['title', 'description', 'severity', 'priority', 'stepsToReproduce', 'expectedResult', 'actualResult'],
  },
};

function extractToolInput<T>(message: Anthropic.Message, toolName: string): T {
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === toolName,
  );
  if (!toolUse) {
    throw new Error(`AI did not call the expected tool "${toolName}".`);
  }
  return toolUse.input as T;
}

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mediaType: 'image/png' | 'image/jpeg' } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const mediaType = contentType.includes('jpeg') || contentType.includes('jpg') ? 'image/jpeg' : 'image/png';
    const buffer = Buffer.from(await res.arrayBuffer());
    return { data: buffer.toString('base64'), mediaType };
  } catch {
    return null;
  }
}

/**
 * The only module in the codebase that imports the Anthropic SDK. Everything
 * else depends on the AIService interface in ./types.ts.
 */
export class AnthropicAIService implements AIService {
  private client: Anthropic;
  private model: string;

  constructor(options?: { apiKey?: string; model?: string }) {
    const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY must be set (server-side only).');
    }
    this.client = new Anthropic({ apiKey });
    this.model = options?.model ?? 'claude-sonnet-5';
  }

  async generateTestCases(input: GenerateTestCasesInput): Promise<GeneratedTestCase[]> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      tools: [GENERATE_TEST_CASES_TOOL],
      tool_choice: { type: 'tool', name: 'submit_test_cases' },
      system:
        'You are a senior QA engineer generating structured Playwright-executable test cases from a plain-language requirement. ' +
        'Cover positive, negative, edge, and validation scenarios. Steps must be concrete UI actions ' +
        '(navigate, click, fill, select, assert) a Playwright script could follow directly. ' +
        'Never include real credentials or secrets in any step.',
      messages: [
        {
          role: 'user',
          content: `Target site: ${input.baseUrl}\n\nRequirement:\n${input.requirementText}`,
        },
      ],
    });

    const { testCases } = extractToolInput<{ testCases: GeneratedTestCase[] }>(message, 'submit_test_cases');
    return testCases;
  }

  async analyzeFailure(
    input: AnalyzeFailureInput,
  ): Promise<Omit<FailureAnalysis, 'id' | 'testResultId' | 'createdAt'>> {
    const textContext = [
      `Test case: ${input.testCase.title}`,
      `Description: ${input.testCase.description}`,
      `Steps: ${JSON.stringify(input.testCase.steps)}`,
      `Expected result: ${input.testCase.expectedResult}`,
      '',
      `Actual status: ${input.testResult.status}`,
      `Duration: ${input.testResult.durationMs}ms`,
      `Error message: ${input.testResult.errorMessage ?? '(none captured)'}`,
    ].join('\n');

    const content: Anthropic.MessageParam['content'] = [{ type: 'text', text: textContext }];

    if (input.evidence.screenshotUrl) {
      const image = await fetchImageAsBase64(input.evidence.screenshotUrl);
      if (image) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: image.mediaType, data: image.data },
        });
        content.push({ type: 'text', text: 'The above is the screenshot captured at the moment of failure.' });
      }
    }

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      tools: [ANALYZE_FAILURE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_failure_analysis' },
      system:
        'You are a QA failure analyst. You must strictly separate what the evidence confirms from what you are ' +
        'guessing. "actualBehavior" must only state what the error message, screenshot, or console log directly ' +
        'show — never speculate there. Put any speculation only in "rootCauseHypothesis", and lower ' +
        '"confidenceLevel" whenever the evidence is thin (e.g. only an error message, no screenshot). ' +
        'Never state a root cause as if it were confirmed fact.',
      messages: [{ role: 'user', content }],
    });

    const analysis = extractToolInput<{
      summary: string;
      expectedBehavior: string;
      actualBehavior: string;
      rootCauseHypothesis?: string;
      confidenceLevel: FailureAnalysis['confidenceLevel'];
      errorCategory: string;
      suggestedSeverity: FailureAnalysis['suggestedSeverity'];
      suggestedPriority: FailureAnalysis['suggestedPriority'];
      reproductionSteps: string[];
    }>(message, 'submit_failure_analysis');

    return analysis;
  }

  async generateBugReport(input: GenerateBugReportInput): Promise<GeneratedBugContent> {
    const context = [
      `Test case: ${input.testCase.title}`,
      `Failure summary: ${input.failureAnalysis.summary}`,
      `Expected behavior: ${input.failureAnalysis.expectedBehavior}`,
      `Actual behavior: ${input.failureAnalysis.actualBehavior}`,
      input.failureAnalysis.rootCauseHypothesis
        ? `Root cause hypothesis (unconfirmed): ${input.failureAnalysis.rootCauseHypothesis}`
        : '',
      `Error category: ${input.failureAnalysis.errorCategory}`,
      `Confidence: ${input.failureAnalysis.confidenceLevel}`,
      `Suggested severity: ${input.failureAnalysis.suggestedSeverity}`,
      `Suggested priority: ${input.failureAnalysis.suggestedPriority}`,
    ]
      .filter(Boolean)
      .join('\n');

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      tools: [GENERATE_BUG_REPORT_TOOL],
      tool_choice: { type: 'tool', name: 'submit_bug_report' },
      system:
        'You are drafting a bug report for a bug tracker from a QA failure analysis. Be concise and factual. ' +
        'If the root cause is only a hypothesis, phrase the description accordingly (e.g. "likely caused by...") ' +
        'rather than stating it as fact.',
      messages: [{ role: 'user', content: context }],
    });

    return extractToolInput<GeneratedBugContent>(message, 'submit_bug_report');
  }
}
