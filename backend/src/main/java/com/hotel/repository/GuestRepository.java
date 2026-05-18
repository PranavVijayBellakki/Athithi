package com.hotel.repository;

import com.hotel.model.Guest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GuestRepository {

    private final JdbcTemplate jdbcTemplate;

    public GuestRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Guest guest) {
        String sql = "INSERT INTO Guests (Guest_ID, First_Name, Last_Name, Phone_Number, Email, ID_Proof_Number) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, guest.getGuestId(), guest.getFirstName(), guest.getLastName(),
                guest.getPhoneNumber(), guest.getEmail(), guest.getIdProofNumber());
    }

    public boolean existsById(String guestId) {
        String sql = "SELECT COUNT(*) FROM Guests WHERE Guest_ID = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, guestId);
        return count != null && count > 0;
    }
}
