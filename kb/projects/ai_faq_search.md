# AI-Powered Semantic FAQ Search Platform

**Project Type:** AI/ML & Cloud Infrastructure  
**Status:** Completed  
**GitHub:** https://github.com/cmorgan3324/weaviate-faq-search

## Overview
Built a secure, cost-efficient AWS infrastructure to host a Weaviate vector database and Streamlit application for semantic FAQ search. The platform uses OpenAI embeddings for document vectorization and provides both semantic and hybrid search capabilities with real-time relevance scoring.

## Architecture
- **Infrastructure:** AWS EC2 with Terraform provisioning
- **Vector Database:** Weaviate deployed via Docker
- **Frontend:** Streamlit web application
- **AI/ML:** OpenAI embeddings for semantic search
- **Security:** VPC, security groups, and IAM roles

## Technical Implementation

### Infrastructure Setup
- Terraform-managed AWS infrastructure
- EC2 instance optimized for vector operations
- VPC with proper security group configurations
- Cost-optimized instance sizing and storage

### Vector Database
- Weaviate vector database deployed in Docker containers
- Custom schema design for FAQ documents
- Efficient indexing and retrieval mechanisms
- Real-time vector similarity search

### AI Integration
- OpenAI API integration for text embeddings
- Semantic search using vector similarity
- Hybrid search combining keyword and semantic matching
- Real-time relevance scoring and ranking

### Frontend Application
- Streamlit-based user interface
- Interactive search with real-time results
- Relevance score visualization
- User-friendly query interface

## Key Features
1. **Semantic Search:** Understanding context and meaning beyond keywords
2. **Hybrid Search:** Combining traditional keyword search with semantic understanding
3. **Real-time Processing:** Instant search results with relevance scoring
4. **Scalable Architecture:** Cloud-native design for easy scaling
5. **Cost Optimization:** Efficient resource utilization

## Technologies Used
- **Cloud:** AWS (EC2, VPC, IAM)
- **Infrastructure:** Terraform
- **Vector Database:** Weaviate
- **AI/ML:** OpenAI API, embeddings
- **Backend:** Python, Docker
- **Frontend:** Streamlit
- **APIs:** RESTful API design

## Technical Challenges Solved
1. **Vector Database Optimization:** Tuned Weaviate for optimal performance
2. **Embedding Strategy:** Implemented efficient text vectorization
3. **Search Relevance:** Balanced semantic and keyword search results
4. **Infrastructure Security:** Proper VPC and security group configuration
5. **Cost Management:** Optimized instance types and storage

## Skills Demonstrated
- AI/ML model integration and deployment
- Vector database design and optimization
- Cloud infrastructure provisioning
- Docker containerization
- API development and integration
- Search algorithm implementation
- Cost-efficient cloud architecture
- Security best practices

## Results
- **Search Accuracy:** Significantly improved over traditional keyword search
- **Performance:** Sub-second query response times
- **User Experience:** Intuitive interface with relevance scoring
- **Scalability:** Ready for production deployment
- **Cost Efficiency:** Optimized for minimal operational costs

This project demonstrates expertise in combining AI/ML technologies with cloud infrastructure to create intelligent search solutions that understand context and meaning.