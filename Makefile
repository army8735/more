build:
	@gulp

test: build test-compile test-compress

test-compile: build
	@mocha tests/test.js -R spec

test-compress: build
	@mocha --timeout 5000 tests/test-compress.js -R spec

coveralls:
	@mocha tests/test.js tests/test-compress.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/test.js tests/test-compress.js --require blanket -R html-cov > tests/covrage.html

.PHONY: build