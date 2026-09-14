import type {
  BugPayload,
  FailureAnalysis,
  TestCase,
  TestResult,
} from '@obsidian/shared-types';

export interface GeneratedTestCase {
  title: string;
  description: string;
  type: TestCase['type'];
  steps: TestCase['steps'];
  expectedResult: string;
}

export interface GenerateTestCasesInput {
  requirementText: string;
  baseUrl: string;
}

export interface AnalyzeFailureInput {
  testCase: TestCase;
  testResult: TestResult;
  evidence: {
    screenshotUrl?: string;
    traceUrl?: string;
    consoleLogUrl?: string;
  };
}

export interface GenerateBugReportInput {
  failureAnalysis: FailureAnalysis;
  testCase: TestCase;
}

/**
 * Provider-agnostic AI abstraction. Nothing outside this package should
 * import an LLM SDK directly — swap the implementation here to change
 * providers without touching the rest of the app.
 */
export interface AIService {
  generateTestCases(input: GenerateTestCasesInput): Promise<GeneratedTestCase[]>;
  analyzeFailure(input: AnalyzeFailureInput): Promise<Omit<FailureAnalysis, 'id' | 'testResultId' | 'createdAt'>>;
  generateBugReport(input: GenerateBugReportInput): Promise<BugPayload>;
}
