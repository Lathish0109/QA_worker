import Anthropic from '@anthropic-ai/sdk';
import type {
  AIService,
  AnalyzeFailureInput,
  GenerateBugReportInput,
  GenerateTestCasesInput,
  GeneratedTestCase,
} from './types';
import type { BugPayload, FailureAnalysis } from '@obsidian/shared-types';

const TEST_CASE_TYPES = ['positive', 'negative', 'edge', 'validation'] as const;

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

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      throw new Error('AI did not return structured test cases.');
    }
    const { testCases } = toolUse.input as { testCases: GeneratedTestCase[] };
    return testCases;
  }

  async analyzeFailure(
    _input: AnalyzeFailureInput,
  ): Promise<Omit<FailureAnalysis, 'id' | 'testResultId' | 'createdAt'>> {
    // Implemented in Milestone 4 (Evidence & failure analysis) once
    // screenshot/trace/console evidence capture exists to feed this.
    throw new Error('analyzeFailure is not yet implemented (Milestone 4).');
  }

  async generateBugReport(_input: GenerateBugReportInput): Promise<BugPayload> {
    // Implemented in Milestone 5 (Bug Tracker integration).
    throw new Error('generateBugReport is not yet implemented (Milestone 5).');
  }
}
