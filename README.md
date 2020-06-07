# @tandil/diffsplit
[![NPM Package Version](https://img.shields.io/npm/v/@tandil/diffsplit)](https://www.npmjs.com/package/@tandil/diffsplit)
[![License](https://img.shields.io/npm/l/@tandil/diffsplit?color=%23007ec6)](https://github.com/danielduarte/diffsplit/blob/master/LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://conventionalcommits.org)

Easy split of .diff & .patch into its files

## What is this?

This CLI utility splits .diff or .patch files in [unified format](https://www.gnu.org/software/diffutils/manual/html_node/Unified-Format.html) into parts **by file** without deleting or overwriting anything.

See a simple [example](#example)

## Installation

```console
npm i -g @tandil/diffsplit
```

_Note that this requires Node.js installed._

## Usage

In your terminal

```console
diffsplit file1.diff file2.diff [... more files]
```

## Example

Suppose you have a diff file `mypatch.diff` you created from a git diff and it includes modifications for 3 files:

```
diff --git a/es6.txt b/es6.txt
index ca683c3..f1a9a31 100644
--- a/es6.txt
+++ b/es6.txt
@@ -1,4 +1,6 @@
-ECMAScript is a scripting-language specification standardized by Ecma International.
-It was created to standardize JavaScript to help foster multiple independent implementations.
-
+ECMAScript
+----------
 
+It is a scripting-language specification standardized by Ecma International.
+It was created to standardize JavaScript to help foster multiple independent implementations.
+It was initially created for web browsers.
diff --git a/life.txt b/life.txt
index 39257de..6410213 100644
--- a/life.txt
+++ b/life.txt
@@ -1,7 +1,10 @@
-Life / From Wikipedia, the free encyclopedia
+Life
+----
 
 Life is a characteristic that distinguishes physical entities that have biological processes,
 such as signaling and self-sustaining processes, from those that do not, either because such
 functions have ceased (they have died), or because they never had such functions and are
 classified as inanimate. Various forms of life exist, such as plants, animals, fungi, protists,
 archaea, and bacteria. Biology is the science concerned with the study of life.
+
+Source: From Wikipedia, the free encyclopedia
diff --git a/lorem.txt b/lorem.txt
index 83449d4..733ae45 100644
--- a/lorem.txt
+++ b/lorem.txt
@@ -1,10 +1,13 @@
 Lorem Ipsum is simply dummy text of the printing and typesetting industry.
+
 Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
 when an unknown printer took a galley of type and scrambled it to make a type
 specimen book.
 
 It has survived not only five centuries, but also the leap into electronic
-typesetting, remaining essentially unchanged. It was popularised in the 1960s
+typesetting, remaining essentially unchanged.
+
+It was popularised in the 1960s
 with the release of Letraset sheets containing Lorem Ipsum passages, and more
 recently with desktop publishing software like Aldus PageMaker including
 versions of Lorem Ipsum.
```

Just running

```console
diffsplit mypatch.diff
```

You will get the output:

```
Processing file: "mypatch.patch"
 OK:
  Split in 3 files
```

and 3 files will be created with the individual diffs for each of the files in your patch:

```
mypatch_0001.patch
mypatch_0002.patch
mypatch_0003.patch
```

Don't worry, this command will not overwrite existing files.
If you had already a file with one of those names, a suffix will be added.
Lets say you had already a file named `mypatch_0003.diff`, the created files would be:

```
mypatch_0001.diff
mypatch_0002.diff
mypatch_0003-1.diff
```

In this example, the resulting files will content:

**mypatch_0001.patch**
```
diff --git a/es6.txt b/es6.txt
index ca683c3..f1a9a31 100644
--- a/es6.txt
+++ b/es6.txt
@@ -1,4 +1,6 @@
-ECMAScript is a scripting-language specification standardized by Ecma International.
-It was created to standardize JavaScript to help foster multiple independent implementations.
-
+ECMAScript
+----------
 
+It is a scripting-language specification standardized by Ecma International.
+It was created to standardize JavaScript to help foster multiple independent implementations.
+It was initially created for web browsers.
```

**mypatch_0002.patch**
```
diff --git a/life.txt b/life.txt
index 39257de..6410213 100644
--- a/life.txt
+++ b/life.txt
@@ -1,7 +1,10 @@
-Life / From Wikipedia, the free encyclopedia
+Life
+----
 
 Life is a characteristic that distinguishes physical entities that have biological processes,
 such as signaling and self-sustaining processes, from those that do not, either because such
 functions have ceased (they have died), or because they never had such functions and are
 classified as inanimate. Various forms of life exist, such as plants, animals, fungi, protists,
 archaea, and bacteria. Biology is the science concerned with the study of life.
+
+Source: From Wikipedia, the free encyclopedia
```

**mypatch_0003.patch**
```
diff --git a/lorem.txt b/lorem.txt
index 83449d4..733ae45 100644
--- a/lorem.txt
+++ b/lorem.txt
@@ -1,10 +1,13 @@
 Lorem Ipsum is simply dummy text of the printing and typesetting industry.
+
 Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
 when an unknown printer took a galley of type and scrambled it to make a type
 specimen book.
 
 It has survived not only five centuries, but also the leap into electronic
-typesetting, remaining essentially unchanged. It was popularised in the 1960s
+typesetting, remaining essentially unchanged.
+
+It was popularised in the 1960s
 with the release of Letraset sheets containing Lorem Ipsum passages, and more
 recently with desktop publishing software like Aldus PageMaker including
 versions of Lorem Ipsum.
```

## Having issues?

Feel free to report any issues or feature request in [Github repo](https://github.com/danielduarte/diffsplit/issues/new).
