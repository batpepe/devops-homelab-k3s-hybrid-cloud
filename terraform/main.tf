provider "aws" {
  region = "eu-central-1" # Наш регіон - Франкфурт
}

# 1. Знаходимо найсвіжіший офіційний образ Ubuntu 22.04
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Офіційний ID Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# 2. Завантажуємо наш замок (публічний SSH ключ) в AWS
resource "aws_key_pair" "deployer" {
  key_name   = "devops-aws-key"
  public_key = file("~/.ssh/aws_ec2_key.pub")
}

# 3. Налаштовуємо Файрвол (Security Group): Відкриваємо порти 22 та 80
resource "aws_security_group" "web_sg" {
  name        = "allow_web_and_ssh"
  description = "Allow SSH and HTTP traffic"

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
    protocol    = "-1" # Дозволяємо серверу виходити в інтернет
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 4. Замовляємо сам сервер!
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro" # Той самий БЕЗКОШТОВНИЙ рівень
  key_name      = aws_key_pair.deployer.key_name

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "DevOps-Homelab-Cloud"
  }
}

# 5. Кажемо Terraform показати нам IP-адресу після створення
output "server_public_ip" {
  value       = aws_instance.web_server.public_ip
  description = "Public IP of our new AWS server"
}
