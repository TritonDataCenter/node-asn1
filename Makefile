#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright 2018, Joyent, Inc.
#

#
# node-asn1 Makefile
#

#
# Tools
#

ISTANBUL	:= node_modules/.bin/istanbul
FAUCET		:= node_modules/.bin/faucet
NPM		:= npm

#
# Files
#

JS_FILES	:= $(shell find lib test -name '*.js')
JSSTYLE_FILES	= $(JS_FILES)
JSSTYLE_FLAGS	= -f tools/jsstyle.conf
ESLINT		= ./node_modules/.bin/eslint
ESLINT_FILES	= $(JS_FILES)

ifeq ($(shell uname -s),SunOS)
	NODE_PREBUILT_VERSION =	v4.6.1
	NODE_PREBUILT_TAG =	zone
	NODE_PREBUILT_IMAGE =	18b094b0-eb01-11e5-80c1-175dac7ddf02
endif

include ./tools/mk/Makefile.defs
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.defs
else
	NODE := node
	NPM := $(shell which npm)
	NPM_EXEC=$(NPM)
endif
include ./tools/mk/Makefile.smf.defs

#
# Repo-specific targets
#

.PHONY: all
all: $(TAPE)
	$(NPM) rebuild

$(ISTANBUL): | $(NPM_EXEC)
	$(NPM) install

$(FAUCET): | $(NPM_EXEC)
	$(NPM) install

CLEAN_FILES += ./node_modules/

.PHONY: test
test: $(ISTANBUL) $(FAUCET)
	$(ISTANBUL) cover --print none test/run.js | $(FAUCET)

include ./tools/mk/Makefile.deps
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.targ
endif
include ./tools/mk/Makefile.smf.targ
include ./tools/mk/Makefile.targ
