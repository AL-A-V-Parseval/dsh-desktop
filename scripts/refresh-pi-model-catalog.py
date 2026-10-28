#!/usr/bin/env python3
"""Generate a data-only pi-ai patch from two public npm tarballs.

Usage: refresh-pi-model-catalog.py base.tgz catalog.tgz catalog-metadata.json
Download metadata from the versioned npm endpoint; integrity is checked here.
The existing streaming compatibility patch is retained verbatim.
"""
import base64
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
    def models(files):
        return [model for name, data in files.items() if name.endswith('.json') and not name.endswith('/.manifest.json')
                for group in json.loads(data).values() for model in group.values()]
    before, after = models(old), models(new)
    if {m['api'] for m in after} - {m['api'] for m in before}:
        raise ValueError('New protocol requires runtime review')
    patch = ROOT / 'patches/pi-ai@1.1.0.patch'
    output = patch.read_text().split(MARKER)[0] + MARKER
    changed = []
    for name in sorted(new):
        if old[name] == new[name]:
            continue
        changed.append(name)
        output += f'diff --git a/{name} b/{name}\n'
        for line in difflib.unified_diff(old[name].decode().splitlines(keepends=True), new[name].decode().splitlines(keepends=True), fromfile='a/' + name, tofile='b/' + name):
            output += line if line.endswith('\n') else line + '\n\\ No newline at end of file\n'
    patch.write_text(output)
    receipt = {'package': metadata['name'], 'runtimeVersion': '1.1.0', 'catalogVersion': metadata['version'],
               'catalogGeneratedAt': manifest['generatedAt'], 'integrity': integrity,
               'source': metadata['dist']['tarball'], 'beforeModels': len(before), 'afterModels': len(after),
               'changedFiles': changed, 'patchSha256': hashlib.sha256(output.encode()).hexdigest()}
    (ROOT / 'pi-model-catalog.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({key: receipt[key] for key in ['runtimeVersion', 'catalogVersion', 'beforeModels', 'afterModels']}))


if __name__ == '__main__':
    main()
