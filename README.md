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

## 🏗️ Architecture Diagram

```mermaid
flowchart LR
    subgraph Local_Dev [DevOps Engineer]
        Mac[MacBook Terminal]
    end

    subgraph GitHub [GitHub Repository]
        Manifests[K8s Manifests]
        IaC[Terraform & Ansible Code]
    end

    subgraph AWS [AWS Cloud Environment]
        EC2[EC2 Instance t3.micro]
        Docker[Docker Engine]
        Web[Nginx Website]
    end

    subgraph Homelab [Local K3s GitOps Cluster]
        Argo[ArgoCD]
        Prom[Prometheus & Grafana]
        Apps[Microservices]
    end

    %% Connections
    Mac -->|git push| GitHub
    Mac -->|terraform apply| EC2
    Mac -->|ansible-playbook| Docker

    Argo -->|Auto-syncs| Manifests
    Argo -->|Deploys| Apps
    Prom -->|Monitors| Apps
    Prom -->|Alerts| Telegram((Telegram Bot))

    EC2 --> Docker
    Docker --> Web

