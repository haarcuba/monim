production:
	git mv docs/CNAME CNAME
	git rm -r docs/
	rm -fr dist/
	npm run build
	mv dist/ docs/
	git add docs/
	git mv CNAME docs/CNAME
