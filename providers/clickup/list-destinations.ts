import { field, json, records, type Destination, type RecordValue, type Run } from '../destination-cli.ts';

export function listDestinations(reference: string, run: Run): Destination<string>[] {
  const destinations: Destination<string>[] = [];
  const seen = new Set<string>();
  const add = (list: RecordValue, path: string) => {
    const id = field(list, 'id');
    if (!id || list.archived === true || seen.has(id)) return;
    seen.add(id);
    destinations.push({ id, name: field(list, 'name'), exactAlias: path,
      choices: () => [{ label: path, value: id }] });
  };
  if (/^(?:https?:\/\/)?(?:app\.)?clickup\.com\/t\//.test(reference)) {
    throw new Error('Supply a ClickUp List URL or ID, not a task URL.');
  }
  if (/^https?:\/\//.test(reference)) {
    const url = new URL(reference);
    if (url.hostname !== 'app.clickup.com' && url.hostname !== 'clickup.com') {
      throw new Error('Supply a native ClickUp List URL.');
    }
    const id = /\/v\/li\/([^/?#]+)/.exec(url.pathname)?.[1] ||
      /\/list\/([^/?#]+)/.exec(url.pathname)?.[1];
    if (!id) throw new Error('Cannot identify a ClickUp List in the URL.');
    const list = records(json(run, 'clickup-cli', ['list', 'get', id, '--output', 'json']))[0];
    if (!list || field(list, 'id') !== id || list.archived === true) {
      throw new Error('ClickUp List URL did not resolve to an active List.');
    }
    const label = field(list, 'name') || id;
    return [{ id, name: label, nativeMatch: true, choices: () => [{ label, value: id }] }];
  }
  if (reference.includes('://')) return [];
  const spaces = records(json(run, 'clickup-cli', ['space', 'list', '--output', 'json']));
  for (const space of spaces) {
    if (space.archived === true) continue;
    const spaceId = field(space, 'id');
    const spaceName = field(space, 'name');
    if (!spaceId) continue;
    const folders = records(json(run, 'clickup-cli', ['folder', 'list', '--space',
      spaceId, '--output', 'json']));
    const folderIds = new Set(folders.map(folder => field(folder, 'id')));
    for (const folder of folders) {
      if (folder.archived === true) continue;
      const folderId = field(folder, 'id');
      if (!folderId) continue;
      const detail = records(json(run, 'clickup-cli', ['folder', 'get', folderId,
        '--output', 'json']))[0];
      if (!detail) throw new Error('ClickUp folder detail is unavailable.');
      if (detail.archived === true) continue;
      const folderName = field(detail, 'name') || field(folder, 'name');
      for (const list of records(detail.lists)) {
        add(list, `${spaceName} / ${folderName} / ${field(list, 'name')}`);
      }
    }
    for (const list of records(json(run, 'clickup-cli', ['list', 'list', '--space',
      spaceId, '--output', 'json']))) {
      const folder = list.folder as RecordValue | undefined;
      if (folder && folderIds.has(field(folder, 'id'))) continue;
      add(list, `${spaceName} / ${field(list, 'name')}`);
    }
  }
  return destinations;
}

