package com.hotel.repository;

import com.hotel.model.Booking;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BookingRepository {

    private final JdbcTemplate jdbcTemplate;

    public BookingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Booking booking) {
        String sql = "INSERT INTO bookings (booking_id, room_id, guest_id, check_in, check_out, status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql, booking.getBookingId(), booking.getRoomId(), booking.getGuestId(),
                booking.getCheckIn(), booking.getCheckOut(), booking.getStatus());
    }

    public java.util.List<Booking> findAllActiveBookings() {
        String sql = "SELECT * FROM bookings WHERE status = 'Confirmed'";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Booking booking = new Booking();
            booking.setBookingId(rs.getString("booking_id"));
            booking.setRoomId(rs.getString("room_id"));
            booking.setGuestId(rs.getString("guest_id"));
            booking.setCheckIn(rs.getTimestamp("check_in").toLocalDateTime());
            booking.setCheckOut(rs.getTimestamp("check_out").toLocalDateTime());
            booking.setStatus(rs.getString("status"));
            return booking;
        });
    }

    public void extendBooking(String bookingId) {
        String sql = "UPDATE bookings SET check_out = check_out + INTERVAL '1' DAY WHERE booking_id = ?";
        jdbcTemplate.update(sql, bookingId);
    }
}
