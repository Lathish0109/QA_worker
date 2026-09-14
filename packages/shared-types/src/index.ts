export type TestCaseType = 'positive' | 'negative' | 'edge' | 'validation';
export type TestCaseStatus = 'draft' | 'approved' | 'rejected';
export type GeneratedBy = 'ai' | 'human';

export interface TestStep {
  action: string;
  target?: string;
  value?: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  requirementId: string;
  title: string;
  description: string;
  type: TestCaseType;
  steps: TestStep[];
  expectedResult: string;
  status: TestCaseStatus;
  generatedBy: GeneratedBy;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TestRunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'partial' | 'error';

export interface TestRun {
  id: string;
  projectId: string;
  triggeredBy: string;
  status: TestRunStatus;
  startedAt?: string;
  completedAt?: string;
}

export type TestResultStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: TestResultStatus;
  durationMs: number;
  errorMessage?: string;
  evidence: {
    screenshotUrl?: string;
    traceUrl?: string;
    consoleLogUrl?: string;
  };
  createdAt: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface FailureAnalysis {
  id: string;
  testResultId: string;
  summary: string;
  expectedBehavior: string;
  actualBehavior: string;
  /** A hypothesis, never asserted as confirmed fact. */
  rootCauseHypothesis?: string;
  confidenceLevel: ConfidenceLevel;
  errorCategory: string;
  suggestedSeverity: Severity;
  suggestedPriority: Priority;
  reproductionSteps: string[];
  createdAt: string;
}

/** Payload sent to the ICore Bug Tracker. Contract is assumed pending confirmation — see DESIGN.md. */
export interface BugPayload {
  title: string;
  description: string;
  severity: string;
  priority: string;
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  evidenceLinks: string[];
  source: 'qa-system';
  sourceRefs: {
    testRunId: string;
    testResultId: string;
    testCaseId: string;
    projectId: string;
  };
}

export interface Project {
  id: string;
  name: string;
  baseUrl: string;
  createdBy: string;
  createdAt: string;
}

export interface Requirement {
  id: string;
  projectId: string;
  text: string;
  createdBy: string;
  createdAt: string;
}
