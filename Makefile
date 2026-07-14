SHELL := bash
.DEFAULT_GOAL := help

REPO        := $(shell pwd)
K8S_DIR     := k8s-infrastructure
TF_DIR      := terraform
DOCKERFILES := $(shell find apps -name Dockerfile)

HADOLINT_IMG    := hadolint/hadolint:2.12.0
YAMLLINT_IMG    := cytopia/yamllint:latest
KUBELINTER_IMG  := stackrox/kube-linter:0.6.8
TFLINT_IMG      := ghcr.io/terraform-linters/tflint:v0.50.3
ACTIONLINT_IMG  := rhysd/actionlint:1.7.12
TRIVY_IMG       := aquasec/trivy:0.72.0

.PHONY: help
help: ## Show this help.
	@grep -E '^[a-zA-Z0-9_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ---- lint ----

.PHONY: lint
lint: lint-docker lint-yaml lint-k8s lint-tf lint-actions scan-tf ## Run every linter.

.PHONY: lint-actions
lint-actions: ## actionlint on .github/workflows.
	@docker run --rm -v $(REPO):/repo -w /repo $(ACTIONLINT_IMG) -color

.PHONY: scan-tf
scan-tf: ## trivy config on terraform/ (the CI gate, locally).
	@docker run --rm -v $(REPO)/$(TF_DIR):/src $(TRIVY_IMG) config --exit-code 1 /src

.PHONY: lint-docker
lint-docker: ## hadolint every Dockerfile under apps/.
	@set -e; for f in $(DOCKERFILES); do echo "==> $$f"; docker run --rm -i $(HADOLINT_IMG) < $$f; done

.PHONY: lint-yaml
lint-yaml: ## yamllint manifests, ansible and workflows (shared config).
	@docker run --rm -v $(REPO):/data $(YAMLLINT_IMG) -c .yamllint.yml $(K8S_DIR) ansible .github/workflows

.PHONY: lint-k8s
lint-k8s: ## kube-linter on all Kubernetes manifests.
	@docker run --rm -v $(REPO):/repo $(KUBELINTER_IMG) lint /repo/$(K8S_DIR)

.PHONY: lint-tf
lint-tf: ## tflint on terraform/.
	@docker run --rm -v $(REPO)/$(TF_DIR):/data -w /data $(TFLINT_IMG)

# ---- validate ----

.PHONY: validate
validate: validate-tf validate-ansible ## Run every validator.

.PHONY: validate-tf
validate-tf: ## terraform fmt -check + validate (root AWS module + cloudflare).
	@terraform fmt -check -recursive
	@set -e; for d in $(TF_DIR) $(TF_DIR)/cloudflare; do \
		terraform -chdir=$$d init -backend=false -no-color > /dev/null; \
		terraform -chdir=$$d validate; \
	done

.PHONY: validate-ansible
validate-ansible: ## ansible-playbook --syntax-check.
	@ansible-playbook -i ansible/inventory.ini ansible/setup-server.yml --syntax-check

# ---- plan, apply, diff ----

.PHONY: plan
plan: ## terraform plan.
	@terraform -chdir=$(TF_DIR) plan

.PHONY: apply
apply: ## terraform apply + ansible-playbook (interactive).
	@terraform -chdir=$(TF_DIR) apply
	@ansible-playbook -i ansible/inventory.ini ansible/setup-server.yml

.PHONY: diff
diff: ## kubectl diff on every workload manifest.
	@find $(K8S_DIR)/apps -name '*.yaml' -print -exec kubectl diff -f {} \; || true

.PHONY: argo-sync
argo-sync: ## Sync every ArgoCD app.
	@argocd app list -o name | xargs -n1 argocd app sync

# ---- dev setup ----

.PHONY: hooks
hooks: ## Install the pre-commit hooks (one-time per clone).
	@command -v pre-commit >/dev/null || { echo "pre-commit not found: pipx install pre-commit (or brew install pre-commit)"; exit 1; }
	@pre-commit install
