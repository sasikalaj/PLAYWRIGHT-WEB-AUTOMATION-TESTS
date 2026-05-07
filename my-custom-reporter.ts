import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { createLogger } from './utils/logger';

const log = createLogger('CustomReporter');

class MyReporter implements Reporter {
  private rootSuite: Suite | null = null;
  constructor(options: { customOption?: string } = {}) {
    log.info(`my-custom-reporter setup with customOption set to ${options.customOption}`);
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.rootSuite = suite;
    log.info(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase) {
    //console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    //console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result: FullResult) {
    log.info(`Finished the run: ${result.status}`);
    log.info(`Duration: ${result.duration}`);
    const passedTests =
      this.rootSuite?.allTests().filter((t) => t.results[0].status === 'passed') || [];
    const failedTests =
      this.rootSuite?.allTests().filter((t) => t.results[0].status === 'failed') || [];
    const skippedTests =
      this.rootSuite?.allTests().filter((t) => t.results[0].status === 'skipped') || [];
    log.info(
      `Passed: ${passedTests.length}, Failed: ${failedTests.length}, Skipped: ${skippedTests.length}`
    );
    const printSuite = (s: Suite, indent = '') => {
      log.debug(`${indent}${s.type ?? 'root'}: ${s.title}`);

      s.tests?.forEach((t) => {
        log.debug(`${indent}  Test: ${t.title} - ${t.results[0].status}`);
      });

      s.suites?.forEach((child) => printSuite(child, indent + '  '));
      if (s.tests?.length) {
        log.debug(`${indent}  Tests in this suite: ${s.tests.length}`);
        const suitePassed = s.tests?.filter((t) => t.results[0].status === 'passed').length;
        const suiteFailed = s.tests?.filter((t) => t.results[0].status === 'failed').length;
        const suiteSkipped = s.tests?.filter((t) => t.results[0].status === 'skipped').length;
        log.debug(
          `${indent}  Passed: ${suitePassed}, Failed: ${suiteFailed}, Skipped: ${suiteSkipped}`
        );
      }
    };
    if (this.rootSuite) printSuite(this.rootSuite);
  }
}
export default MyReporter;
