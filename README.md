# ☁️ Hybrid Cloud DevOps Homelab & GitOps Automation

![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Ansible](https://img.shields.io/badge/ansible-%231A1918.svg?style=for-the-badge&logo=ansible&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-%23EF7B4D.svg?style=for-the-badge&logo=argo&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)

## 📌 Overview
This repository contains a complete, production-ready DevOps infrastructure project demonstrating a Hybrid Cloud approach. It combines a local GitOps-managed Kubernetes (K3s) cluster with cloud infrastructure provisioned on AWS using Infrastructure as Code (IaC) principles.

## 🏗️ Architecture & Tech Stack

* **Infrastructure as Code (IaC):** Terraform (AWS EC2, Security Groups, Key Pairs).
* **Configuration Management:** Ansible (Automated Docker & Nginx provisioning).
* **Container Orchestration:** Kubernetes (K3s).
* **Continuous Deployment (GitOps):** ArgoCD (Automated syncing, Self-healing, Zero-downtime deployments).
* **Observability & Alerting:** Kube-Prometheus-Stack, Grafana, custom HTML Telegram Bot Alerts.
* **Microservices:** Flask, Node.js (Echo Server), Nginx.

## 📂 Repository Structure

```text
.
├── ansible/                 # Configuration management playbooks
│   ├── inventory.ini        # Target AWS EC2 instances
│   └── setup-server.yml     # Playbook to install Docker & run containers
├── argocd-apps/             # ArgoCD Application definitions (The "App of Apps")
│   ├── monitoring-stack.yaml
│   └── my-apps.yaml
├── k8s-infrastructure/      # Kubernetes manifests for microservices
│   ├── apps/
│   │   ├── flask/           # Python Flask application
│   │   ├── nginx/           # Web server
│   │   └── nodejs/          # Echo server for network testing
├── terraform/               # Infrastructure as Code for AWS
│   ├── main.tf              # AWS Provider, EC2, Security Groups
│   └── .gitignore           # Protecting Terraform state files
└── README.md
