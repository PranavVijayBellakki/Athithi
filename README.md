<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b1d20fd4-399c-477a-adb8-2eeda22a2961

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# 🏨 Athithi - Hotel Management System

A robust, full-stack Hotel Management System developed as a 5th-Semester DBMS Mini Project for the Computer Science & Engineering department. This application streamlines hotel operations by automating room allocations, enforcing strict booking constraints, and simulating end-to-end guest transactions.

## 🚀 Tech Stack
* **Backend:** Java 17, Spring Boot
* **Database Management:** Pure JDBC (`JdbcTemplate`) - *Zero ORM overhead*
* **Database:** Oracle Database 19c / 21c (ojdbc8)
* **Frontend:** HTML, CSS, JavaScript, JSP

## ✨ Key Features
* **Explicit SQL Execution:** Utilizes Spring's `JdbcTemplate` for precise, highly-optimized raw SQL queries and transparent database interactions.
* **ACID Transactional Integrity:** Core business logic is strictly bound by `@Transactional` annotations to prevent partial data writes during complex booking flows.
* **Dynamic Time Constraints:** Enforces a strict 1-day (24-hour) booking lifecycle to optimize room turnover.
* **Live Reverse Countdown & Auto-Checkout:** Features a real-time JavaScript frontend timer that polls the database. Upon expiration, it triggers an automated REST API to force checkout and free the room.
* **Mock Payment Gateway:** Simulates a complete user transaction flow (Selection ➔ Processing ➔ Bypass ➔ Persistence) for seamless demo purposes.

## 🛠️ Database Schema (Normalized)
1. `Rooms` (room_id, room_number, type_name, base_price, status)
2. `Guests` (guest_id, first_name, last_name, phone_number, email, id_proof)
3. `Bookings` (booking_id, room_id, check_in, check_out, status)
4. `Payments` (payment_id, booking_id, payment_date, payment_method, amount_paid)
5. `Staff` (staff_id, first_name, last_name, role, shift, salary)

## ⚙️ Local Setup Instructions
1. Clone this repository:
   ```bash
   git clone [https://github.com/PranavVijayBellakki/Athithi.git](https://github.com/PranavVijayBellakki/Athithi.git)
