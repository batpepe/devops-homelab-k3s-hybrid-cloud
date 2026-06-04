provider "aws" {
  region = "eu-central-1"
}

variable "allowed_ssh_cidr" {
  description = "Your public IP in CIDR notation (e.g. 203.0.113.5/32). Run: curl -s ifconfig.me"
  type        = string
}

# Look up the latest official Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Import our SSH public key so EC2 can accept our connections
resource "aws_key_pair" "deployer" {
  key_name   = "devops-aws-key"
  public_key = file("~/.ssh/aws_ec2_key.pub")
}

# Security group: SSH from our IP only, HTTP open for the web app
resource "aws_security_group" "web_sg" {
  name        = "allow_web_and_ssh"
  description = "Allow SSH and HTTP traffic"

  ingress {
    description = "SSH from your IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "DevOps-Homelab-Cloud"
  }
}

output "server_public_ip" {
  value       = aws_instance.web_server.public_ip
  description = "Public IP of our new AWS server"
}
