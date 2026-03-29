# 🍽️ Smart Restaurant Ordering System

A fullstack web application that digitizes the food ordering process in restaurants using QR codes and real-time communication.

---

## 🚀 Demo
- Images-demo

---

## 📖 Overview

This project aims to solve common issues in traditional restaurant ordering such as:
- Long waiting time
- Order mistakes
- Inefficient communication between staff

The system allows customers to scan a QR code at the table, browse the menu, and place orders directly from their mobile devices.

---

## 🧩 Features

### 👤 Customer (QR Menu)
- Scan QR code to access menu
- Browse food by category
- Add/remove/update items in cart
- Add notes for each dish
- Place order directly

### 🧑‍💼 Receptionist / Cashier Dashboard
- Real-time order notifications (Socket.io)
- Manage table status (available, serving, paid)
- View order details by table
- Print invoice & update payment status

### 👨‍🍳 Kitchen Dashboard
- Real-time order queue
- Update food status (pending → cooking → done)
- Prioritize orders

### ⚙️ Admin Features
- CRUD Tables (generate QR code per table)
- CRUD Menu (categories, food, images, price)
- Order management & history
- Revenue statistics (daily/monthly)

---

## 🏗️ System Architecture

- Client - Server architecture
- RESTful API + WebSocket (real-time)
