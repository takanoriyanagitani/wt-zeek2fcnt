#!/bin/sh

iname=./zeek2fcnt.wat
oname=./zeek2fcnt.wasm

wat2wasm \
	"${iname}" \
	-o "${oname}" \
	--enable-function-references \
	--enable-extended-const \
	--enable-tail-call \
	--enable-relaxed-simd || exec sh -c '
		echo unable to compile.
		exit 1
	'

ls -l "${oname}"
