setup: install pre-commit-install ## Complete development setup

pre-commit-install: ## Setup pre-commit hooks
	uv tool run pre-commit install
.PHONY: pre-commit-install

install: ## Install project dependencies
	uv sync --all-extras && cd docs-new && npm install
.PHONY: setup


dev: ## Start development server
	cd docs-new && npm run dev
.PHONY: dev

test-docs-nb: ## Run notebook E2E tests (overwrites outputs by default; set OVERWRITE_NB=0 to skip)
	uv run pytest tests/test_docs_nb.py -v
.PHONY: test-docs-nb

test-docs-nb-readonly: ## Run notebook tests without writing outputs back
	OVERWRITE_NB=0 uv run pytest tests/test_docs_nb.py -v
.PHONY: test-docs-nb-readonly

regen-mdx: ## Regenerate .mdx files from .ipynb notebooks
	cd docs-new && node scripts/convert-notebooks.mjs
.PHONY: regen-mdx

test-docs: test-docs-nb ## Run all doc tests
.PHONY: test-docs
