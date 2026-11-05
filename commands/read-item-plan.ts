import type { ItemComment, ItemProvider } from './read-item.ts';

export function readItemPlan(provider: ItemProvider, comments: ItemComment[]): string {
  const marker = 'Agent-Workflows-Approved-Plan:\n\n';
  const renderedMarker = 'Agent-Workflows-Approved-Plan:\n';
  const comment = comments.find((candidate) => {
    return candidate.body.startsWith(marker)
      || (provider === 'clickup' && candidate.body.startsWith(renderedMarker));
  });
  if (!comment) {
    throw new Error('No approved plan comment is available.');
  }
  if (provider === 'clickup' && !comment.body.startsWith(marker)) {
    const content = comment.body.slice(renderedMarker.length);
    if (!content.startsWith('# ') || !content.endsWith('\n')) {
      throw new Error('Invalid ClickUp approved plan content.');
    }
    return content.slice(0, -1);
  }
  const content = comment.body.slice(marker.length);
  if (provider === 'linear') {
    return content;
  }
  const fence = /^(`{3,})markdown\n/.exec(content);
  if (!fence || !content.endsWith(`\n${fence[1]}`)) {
    throw new Error('Invalid ClickUp approved plan fence.');
  }
  return content.slice(fence[0].length, -`\n${fence[1]}`.length);
}
