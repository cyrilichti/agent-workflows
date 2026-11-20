import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveItemDestination } from './resolve-item-destination.ts';

function resolveClickUpLists(reference: string, ...listNames: string[]) {
  return resolveItemDestination('clickup', reference, (_program, args) => {
    if (args[0] === 'space') return JSON.stringify([{ id: 'space-1', name: 'Product' }]);
    if (args[0] === 'folder' && args[1] === 'list') return JSON.stringify([]);
    if (args[0] === 'list') return JSON.stringify(listNames.map((name, index) => ({
      id: `list-${index + 1}`, name,
    })));
    throw new Error(`Unexpected command: ${args.join(' ')}`);
  });
}

test('Linear project shared by two teams remains a user choice', () => {
  const result = resolveItemDestination('linear', 'Roadmap', (_program, args) => {
    if (args[0] === 'team') return JSON.stringify([]);
    if (args[0] === 'project') return JSON.stringify([
      { id: 'project-1', name: 'Roadmap', status: { type: 'planned' } },
    ]);
    return JSON.stringify({ data: { project: { teams: { nodes: [
      { id: 'team-1', key: 'A' }, { id: 'team-2', key: 'B' },
    ], pageInfo: { hasNextPage: false, endCursor: null } } } } });
  });
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.candidates?.length, 2);
});

test('Linear exact team key resolves without a second choice', () => {
  const result = resolveItemDestination('linear', 'ICY', (_program, args) => {
    if (args[0] === 'team') return JSON.stringify([
      { id: 'team-1', key: 'ICY', name: 'Icyscreen' },
    ]);
    return JSON.stringify([]);
  });
  assert.deepEqual(result, { status: 'resolved', provider: 'linear',
    destination: { team: 'team-1' } });
});

test('Linear native project URL resolves through its project and team', () => {
  const url = 'https://linear.app/acme/project/roadmap-123/overview';
  const result = resolveItemDestination('linear', url, (_program, args) => {
    if (args[0] === 'team') return JSON.stringify([]);
    if (args[0] === 'project') return JSON.stringify([{ id: 'project-1',
      name: 'Roadmap', url }]);
    return JSON.stringify({ data: { project: { teams: { nodes: [
      { id: 'team-1', key: 'A' },
    ], pageInfo: { hasNextPage: false, endCursor: null } } } } });
  });
  assert.deepEqual(result, { status: 'resolved', provider: 'linear',
    destination: { team: 'team-1', project: 'project-1' } });
});

test('ClickUp exact list ID resolves after complete enumeration', () => {
  const result = resolveItemDestination('clickup', 'list-1', (_program, args) => {
    if (args[0] === 'space') return JSON.stringify([{ id: 'space-1', name: 'Product' }]);
    if (args[0] === 'folder' && args[1] === 'list') return JSON.stringify([]);
    if (args[0] === 'list') return JSON.stringify([{ id: 'list-1', name: 'Ideas' }]);
    throw new Error(`Unexpected command: ${args.join(' ')}`);
  });
  assert.deepEqual(result, { status: 'resolved', provider: 'clickup',
    destination: 'list-1' });
});

test('ClickUp prefers a whole-word match over a partial substring', () => {
  assert.deepEqual(resolveClickUpLists('Atlas', 'Demandes ATLAS', 'AtlasPro'), {
    status: 'resolved', provider: 'clickup', destination: 'list-1',
  });
});

test('ClickUp asks the user to choose between equally strong whole-word matches', () => {
  const result = resolveClickUpLists('Atlas', 'Demandes ATLAS', 'Support Atlas', 'AtlasPro');
  assert.equal(result.status, 'ambiguous');
  assert.deepEqual(result.candidates?.map(candidate => candidate.value), ['list-1', 'list-2']);
});

test('ClickUp asks for clarification when only a partial substring matches', () => {
  const result = resolveClickUpLists('Atlas', 'AtlasPro');
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.candidates?.[0]?.match, 'possible');
});

test('ClickUp recognizes a complete multi-word project name within punctuation', () => {
  assert.deepEqual(resolveClickUpLists('Café Atlas', 'Demandes (CAFE-ATLAS) Europe'), {
    status: 'resolved', provider: 'clickup', destination: 'list-1',
  });
});

test('ClickUp prefers an exact list name over a whole-word match inside another list name', () => {
  assert.deepEqual(resolveClickUpLists('Atlas', 'Support Atlas', 'ATLAS'), {
    status: 'resolved', provider: 'clickup', destination: 'list-2',
  });
});

test('ClickUp resolves a List inside a Folder from Folder details', () => {
  const result = resolveItemDestination('clickup', 'Product / Delivery / Sprint',
    (_program, args) => {
      if (args[0] === 'space') return JSON.stringify([{ id: 'space-1', name: 'Product' }]);
      if (args[0] === 'folder' && args[1] === 'list') {
        return JSON.stringify([{ id: 'folder-1', name: 'Delivery' }]);
      }
      if (args[0] === 'folder' && args[1] === 'get') {
        return JSON.stringify({ id: 'folder-1', name: 'Delivery',
          lists: [{ id: 'list-1', name: 'Sprint' }] });
      }
      if (args[0] === 'list') return JSON.stringify([]);
      throw new Error(`Unexpected command: ${args.join(' ')}`);
    });
  assert.deepEqual(result, { status: 'resolved', provider: 'clickup',
    destination: 'list-1' });
});

test('ClickUp native List URL reads the exact List', () => {
  const result = resolveItemDestination('clickup',
    'https://app.clickup.com/123/v/li/list-1', (_program, args) => {
      assert.deepEqual(args, ['list', 'get', 'list-1', '--output', 'json']);
      return JSON.stringify({ id: 'list-1', name: 'Sprint' });
    });
  assert.deepEqual(result, { status: 'resolved', provider: 'clickup',
    destination: 'list-1' });
});

test('ClickUp rejects a foreign List URL before calling its CLI', () => {
  assert.throws(() => resolveItemDestination('clickup',
    'https://example.com/list/list-1', () => {
      throw new Error('CLI should not run.');
    }), /native ClickUp List URL/);
});

test('ClickUp does not present a folder List as folderless', () => {
  const result = resolveItemDestination('clickup', 'Product / Sprint',
    (_program, args) => {
      if (args[0] === 'space') return JSON.stringify([{ id: 'space-1', name: 'Product' }]);
      if (args[0] === 'folder' && args[1] === 'list') {
        return JSON.stringify([{ id: 'folder-1', name: 'Delivery' }]);
      }
      if (args[0] === 'folder' && args[1] === 'get') {
        return JSON.stringify([{ id: 'folder-1', name: 'Delivery', lists: [
          { id: 'list-1', name: 'Sprint' },
        ] }]);
      }
      if (args[0] === 'list') return JSON.stringify([{ id: 'list-1',
        name: 'Sprint', folder: { id: 'folder-1', name: 'Delivery' } }]);
      throw new Error(`Unexpected command: ${args.join(' ')}`);
    });
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.candidates?.length, 1);
  assert.equal(result.candidates?.[0]?.label, 'Product / Delivery / Sprint');
});
