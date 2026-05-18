package com.hotel.repository;

import com.hotel.model.Payment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentRepository {

    private final JdbcTemplate jdbcTemplate;

    public PaymentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Payment payment) {
        String sql = "INSERT INTO payments (payment_id, booking_id, amount_paid, payment_method, payment_date) " +
                "VALUES (?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql, payment.getPaymentId(), payment.getBookingId(), payment.getAmountPaid(),
                payment.getPaymentMethod(), payment.getPaymentDate());
    }
}
