#!/usr/bin/env python3
"""Generate a data-only pi-ai patch from two public npm tarballs.

Usage: refresh-pi-model-catalog.py base.tgz catalog.tgz catalog-metadata.json
Download metadata from the versioned npm endpoint; integrity is checked here.
The existing streaming compatibility patch is retained verbatim.
"""
import base64
import copy
import difflib
import hashlib
import json
from pathlib import Path
import sys
import tarfile

ROOT = Path(__file__).resolve().parent.parent
MARKER = '# Desktop data-only model catalog refresh\n'


def contents(path):
    with tarfile.open(path) as archive:
        return {member.name.removeprefix('package/'): archive.extractfile(member).read()
                for member in archive.getmembers() if member.isfile() and
                (member.name.startswith('package/dist/providers/data/') or
                 member.name == 'package/dist/models.generated.js')}


def main():
    base, latest, metadata_path = map(Path, sys.argv[1:])
    with tarfile.open(base) as archive:
        runtime_version = json.loads(archive.extractfile('package/package.json').read())['version']
    if runtime_version not in ['1.1.0', '1.4.0']:
        raise ValueError('Unreviewed pi-ai runtime version')
    metadata = json.loads(metadata_path.read_text())
    integrity = 'sha512-' + base64.b64encode(hashlib.sha512(latest.read_bytes()).digest()).decode()
    if metadata['name'] != '@earendil-works/pi-ai' or integrity != metadata['dist']['integrity']:
        raise ValueError('npm catalog package identity/integrity mismatch')
    old, new = contents(base), contents(latest)
    if old.keys() != new.keys() or old['dist/models.generated.js'] != new['dist/models.generated.js']:
        raise ValueError('Catalog loader or provider file set changed; review required')
    manifest = json.loads(new['dist/providers/data/.manifest.json'])
    if manifest['schemaVersion'] != json.loads(old['dist/providers/data/.manifest.json'])['schemaVersion']:
        raise ValueError('Catalog schema changed; review required')
    for filename, digest in manifest['files'].items():
        if hashlib.sha256(new['dist/providers/data/' + filename]).hexdigest() != digest:
            raise ValueError('Catalog manifest hash mismatch: ' + filename)
    catalog_generated_at = manifest['generatedAt']
    additions_path = ROOT / 'pi-model-catalog-additions.json'
    additions = json.loads(additions_path.read_text()) if additions_path.exists() else None
    if additions is not None:
        for entry in additions['models']:
            filename = 'dist/providers/data/' + entry['provider'] + '.json'
            groups = json.loads(new[filename])
            matches = [(api, model) for api, group in groups.items() for model in group.values()
                       if model['id'] == entry['baseModelId']]
            if len(matches) != 1:
                raise ValueError('Addition template is missing or ambiguous')
            api, template = matches[0]
            model = {**copy.deepcopy(template), **entry['changes']}
            if model['provider'] != entry['provider'] or model['api'] != api:
                raise ValueError('Addition cannot change the protocol or route')
            key = model.get('type', 'chat') + ':' + model['id']
            if any(value['id'] == model['id'] for group in groups.values() for value in group.values()):
                raise ValueError('Addition is now in the published catalog; review/retire the backport')
            groups[api][key] = model
            new[filename] = json.dumps(groups, ensure_ascii=False, separators=(',', ':')).encode() + b'\n'
        structure = {}
        for filename in sorted(manifest['files']):
            data = new['dist/providers/data/' + filename]
            manifest['files'][filename] = hashlib.sha256(data).hexdigest()
            groups = json.loads(data)
            structure[filename.removesuffix('.json')] = dict(sorted((key, api) for api, group in groups.items() for key in group))
        manifest['structureHash'] = hashlib.sha256(json.dumps(structure, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        manifest['generatedAt'] = additions['generatedAt']
        new['dist/providers/data/.manifest.json'] = json.dumps(manifest, separators=(',', ':')).encode() + b'\n'
    def models(files):
        return [model for name, data in files.items() if name.endswith('.json') and not name.endswith('/.manifest.json')
                for group in json.loads(data).values() for model in group.values()]
    before, after = models(old), models(new)
    if {m['api'] for m in after} - {m['api'] for m in before}:
        raise ValueError('New protocol requires runtime review')
    patch = ROOT / f'patches/pi-ai@{runtime_version}.patch'
    streaming_patch = patch if patch.exists() else ROOT / 'patches/pi-ai@1.1.0.patch'
    output = streaming_patch.read_text().split(MARKER)[0] + MARKER
    changed = []
    for name in sorted(new):
        if old[name] == new[name]:
            continue
        changed.append(name)
        output += f'diff --git a/{name} b/{name}\n'
        for line in difflib.unified_diff(old[name].decode().splitlines(keepends=True), new[name].decode().splitlines(keepends=True), fromfile='a/' + name, tofile='b/' + name):
            output += line if line.endswith('\n') else line + '\n\\ No newline at end of file\n'
    patch.write_text(output)
    receipt = {'package': metadata['name'], 'runtimeVersion': runtime_version, 'catalogVersion': metadata['version'],
               'catalogGeneratedAt': manifest['generatedAt'], 'publishedCatalogGeneratedAt': catalog_generated_at, 'integrity': integrity,
               'additionsSources': additions['sources'] if additions else [],
               'additionsSha256': hashlib.sha256(additions_path.read_bytes()).hexdigest() if additions else None,
               'source': metadata['dist']['tarball'], 'beforeModels': len(before), 'afterModels': len(after),
               'changedFiles': changed, 'patchSha256': hashlib.sha256(output.encode()).hexdigest()}
    receipt_name = 'pi-model-catalog.json' if runtime_version == '1.1.0' else f'pi-model-catalog-{runtime_version}.json'
    (ROOT / receipt_name).write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({key: receipt[key] for key in ['runtimeVersion', 'catalogVersion', 'beforeModels', 'afterModels']}))


if __name__ == '__main__':
    main()
