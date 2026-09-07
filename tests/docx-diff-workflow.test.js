import fs from 'fs';
import path from 'path';

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'docx-diff.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

describe('DOCX diff workflow', () => {
  test('runs pull request code in the unprivileged pull_request context', () => {
    expect(workflow).toMatch(/^\s*pull_request:\s*$/m);
    expect(workflow).not.toMatch(/^\s*pull_request_target:\s*$/m);
  });

  test('does not persist checkout credentials in the PR worktree', () => {
    const currentCheckout = workflow.match(/- name: Checkout PR branch[\s\S]*?(?=\n\s{6}- name:)/);

    expect(currentCheckout).not.toBeNull();
    expect(currentCheckout[0]).toMatch(/persist-credentials:\s*false/);
  });

  test('keeps the report inside the current worktree and aligns every consumer', () => {
    expect(workflow).toContain('working-directory: current');
    expect(workflow).toContain(
      'node scripts/diff-docx.js ../baseline.docx ../current.docx --output diff-report.md'
    );
    expect(workflow.match(/current\/diff-report\.md/g)).toHaveLength(4);
  });

  test('posts comments only when the PR branch belongs to the base repository', () => {
    expect(workflow).toContain(
      "if: steps.report.outputs.report != '' && github.event.pull_request.head.repo.full_name == github.repository"
    );
  });
});
