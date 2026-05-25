# ☁️ Hybrid Cloud DevOps Homelab & GitOps Automation

[![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![ArgoCD](https://img.shields.io/badge/ArgoCD-%23EF7B4D.svg?style=for-the-badge&logo=argo&logoColor=white)](https://argoproj.github.io/cd/)
[![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)](https://prometheus.io/)

## 📌 Overview

This repository contains a complete, production-ready DevOps infrastructure project. It combines a self-hosted GitOps-managed Kubernetes (k3s) cluster with cloud integrations, CI/CD automation, and a custom-built 3-tier microservice application serving as a dynamic CV.

**Live Demo:** [https://batpepe.online](https://batpepe.online) *(Securely tunneled via Cloudflare Zero Trust)*

## 🏗️ Architecture Diagram

```mermaid
flowchart LR
    subgraph Users [External Traffic]
        Internet[Public Internet]
    end

    subgraph GitHub [CI/CD Pipeline]
        Code[Source Code] --> CI[GitHub Actions: Build & Push]
        CI --> GHCR[GitHub Container Registry]
        Code --> CD[GitOps Manifests Update]
    end

    subgraph Cloudflare [Cloudflare Edge]
        DNS[DNS & SSL]
        WAF[Cloudflare WAF]
    end

    subgraph K3s_Cluster [Local k3s Kubernetes Cluster]
        Tunnel[Cloudflared Pod]
        Argo[ArgoCD]
        
        subgraph Three_Tier_App [3-Tier CV Application]
            Nginx[Nginx Frontend: 80]
            Node[Node.js Backend API: 80]
            DB[(PostgreSQL + PV)]
        end

        subgraph Monitoring [Observability]
            Prom[Prometheus]
            Grafana[Grafana]
        end
        
        subgraph Network [Local Net]
            Pihole[Pi-hole DNS]
        end
    end

    %% Connections
    Internet --> DNS
    DNS --> WAF
    WAF -->|Encrypted Tunnel| Tunnel
    Tunnel -->|Ingress| Nginx
    Tunnel -->|Ingress| Node
    
    Nginx -->|Fetch API| Node
    Node -->|Read/Write| DB
    
    CD -->|Auto-syncs| Argo
    Argo -->|Deploys| Three_Tier_App
    Argo -->|Deploys| Tunnel
    
    Prom -->|Scrapes| Three_Tier_App
    Prom -->|Alerts| Telegram((Telegram Bot))
