#!/usr/bin/env python

from sys import argv
from os import listdir
from os.path import isfile, join, basename, splitext


def file_to_string(folder_path, file_path):
    data = []
    file_name = splitext(basename(file_path))[0]
    with open(join(folder_path, file_path)) as f:
        filelines = f.read().splitlines()
        data = "\\n\\\n".join(filelines).replace('"', '\\"')

    return (file_name, data)


def write_to_file(folder_path, output_folder, data):
    package_name = basename(folder_path)
    output_file = join(output_folder, package_name + ".js")
    with open(output_file, 'w') as of:
        of.write("""\nvar %s = {};\n""" % package_name)
        of.write("""\n%s.data = {};\n""" % package_name)
        demo_names = ", ".join(['"' + n[0] + '"' for n in data])
        of.write("""\n%s.names = [%s];\n""" % (package_name, demo_names))

        for l in data:
            of.write("""\n%s.data.%s = "%s";\n""" % (package_name, l[0], l[1]))
        of.write("""\nmodule.exports = %s;\n""" % package_name)


def main():
    folder_path = argv[1]
    output_folder = argv[2]
    files = [f for f in listdir(folder_path) if isfile(join(folder_path, f))]

    data = []
    for wlfile in files:
        data.append(file_to_string(folder_path, wlfile))

    write_to_file(folder_path, output_folder, data)

if __name__ == '__main__':
    main()
