import * as fs from 'fs';
import * as path from 'path';
import {
  allChecksPassed,
  formatReportMarkdown,
  runAllInvestigations
} from './investigations';

function main() {
  const reports = runAllInvestigations();
  const ok = allChecksPassed(reports);
  const md = formatReportMarkdown(reports);
  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(reports, null, 2));
  fs.writeFileSync(path.join(outDir, 'latest.md'), md);

  process.stdout.write(md + '\n');
  process.stdout.write('Wrote reports/latest.json and reports/latest.md\n');

  if (!ok) {
    process.stderr.write('One or more checks failed.\n');
    process.exit(1);
  }
}

main();
