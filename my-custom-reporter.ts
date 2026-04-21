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

    //const printSuite = (s: Suite, indent = '', suitetitle: string| undefined) => {

    //s.tests.forEach(t => console.log(`${indent}  Test: ${t.title} - ${t.results[0].status}`));
    //   this.rootSuite?.suites?.forEach(child => {
    //     console.log(`${child.type?? 'FullProject'}: ${child.title}`);
    //     child.tests.length && console.log(` Tests in this suite: ${child.tests.length}`);
    //     child.suites?.forEach(t => {
    //       switch (t.tests.results[0].status) {
    //         case 'passed':
    //             console.log(`${''}    Test: ${t.title} - PASSED`);
    //             break;
    //         case 'failed':
    //             console.log(`${''}     Test: ${t.title} - FAILED`);
    //             break;
    //         case 'skipped':
    //             console.log(`${''}     Test: ${t.title} - SKIPPED`);
    //             break;
    //         default:
    //             console.log(`${''}     Test: ${t.title} - UNKNOWN STATUS`);
    //     }
    //     });
    //     // child.tests?.forEach(t => {
    //     //     switch (t.results[0].status) {
    //     //         case 'passed':
    //     //             console.log(`${indent}    Test: ${t.title} - PASSED`);
    //     //             break;
    //     //         case 'failed':
    //     //             console.log(`${indent}    Test: ${t.title} - FAILED`);
    //     //             break;
    //     //         case 'skipped':
    //     //             console.log(`${indent}    Test: ${t.title} - SKIPPED`);
    //     //             break;
    //     //         default:
    //     //             console.log(`${indent}    Test: ${t.title} - UNKNOWN STATUS`);
    //     //     }

    //   }
    // );
  }
}
export default MyReporter;
