# ☁️ Hybrid Cloud DevOps Homelab & GitOps Automation

![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Ansible](https://img.shields.io/badge/ansible-%231A1918.svg?style=for-the-badge&logo=ansible&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-%23EF7B4D.svg?style=for-the-badge&logo=argo&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)

## 📌 Overview
This repository contains a complete, production-ready DevOps infrastructure project demonstrating a Hybrid Cloud approach. It combines a local GitOps-managed Kubernetes (K3s) cluster with cloud infrastructure provisioned on AWS using Infrastructure as Code (IaC) principles.

**Live Demo:**
[https://cv.batpepe.online] 
[https://game.batpepe.online]
*(Securely tunneled via Cloudflare Zero Trust)*

## 🏗️ Architecture Diagram

```mermaid
flowchart LR
    subgraph Local_Dev [DevOps Engineer]
        Mac[MacBook Terminal]
    end

    subgraph GitHub [GitHub Repository]
        Manifests[K8s Manifests]
        IaC[Terraform & Ansible Code]
        Actions[GitHub Actions CI]
    end

    subgraph AWS [AWS Cloud Environment]
        EC2[EC2 Instance t3.micro]
        Docker[Docker Engine]
    end

    subgraph Cloudflare [Cloudflare Edge]
        WAF[Cloudflare WAF / DNS]
    end

    subgraph Homelab [Local K3s GitOps Cluster]
        Argo[ArgoCD]
        Prom[Prometheus & Grafana]
        Tunnel[Cloudflared Tunnel]
        
        subgraph Three_Tier_App [3-Tier CV Application]
            Nginx[Nginx Frontend]
            Node[Node.js Backend]
            DB[(PostgreSQL)]
        end
        
        Pihole[Pi-hole Local DNS]
        Apps[Other Microservices]
    end

    %% Connections
    Mac -->|git push| GitHub
    Mac -->|terraform apply| EC2
    Mac -->|ansible-playbook| Docker

    GitHub -->|Triggers| Actions
    Actions -->|Updates Image| Manifests

    Argo -->|Auto-syncs| Manifests
    Argo -->|Deploys| Three_Tier_App
    Argo -->|Deploys| Tunnel
    Argo -->|Deploys| Apps
    
    Prom -->|Monitors| Homelab
    Prom -->|Alerts| Telegram((Telegram Bot))

    Users((External Users)) --> WAF
    WAF -->|Encrypted Tunnel| Tunnel
    Tunnel --> Nginx
    Tunnel --> Node
    
    Nginx --> Node
    Node --> DB
