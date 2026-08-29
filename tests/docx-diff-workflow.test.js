import fs from 'fs';
import path from 'path';

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'docx-diff.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

describe('DOCX diff workflow', () => {
  test('runs untrusted pull request code in the pull_request security context', () => {
    expect(workflow).toMatch(/^\s*pull_request:\s*$/m);
    expect(workflow).not.toMatch(/^\s*pull_request_target:\s*$/m);
  });

  test('does not persist checkout credentials in the PR worktree', () => {
    const currentCheckout = workflow.match(/- name: Checkout PR branch[\s\S]*?(?=\n\s{6}- name:)/);

    expect(currentCheckout).not.toBeNull();
    expect(currentCheckout[0]).toMatch(/persist-credentials:\s*false/);
  });

  test('writes the diff report from the workflow root', () => {
    expect(workflow).toContain(
      'node current/scripts/diff-docx.js baseline.docx current.docx --output diff-report.md'
    );
  });

  test('posts comments only for branches in the base repository', () => {
    expect(workflow).toContain(
      "if: steps.report.outputs.report != '' && github.event.pull_request.head.repo.full_name == github.repository"
    );
  });
});
