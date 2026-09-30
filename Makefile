.PHONY: build test verify install-smoke

build:
	npm run build

test:
	npm test

verify:
	npm run verify

install-smoke:
	node --test tests/install-smoke.mjs
