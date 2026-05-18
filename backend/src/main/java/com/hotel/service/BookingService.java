package com.hotel.service;

import com.hotel.model.Booking;
import com.hotel.model.Guest;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final JdbcTemplate jdbcTemplate;

    public BookingService(BookingRepository bookingRepository, GuestRepository guestRepository,
            RoomRepository roomRepository, JdbcTemplate jdbcTemplate) {
        this.bookingRepository = bookingRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    // @Transactional ensures all 3 operations succeed or fail together.
    @Transactional
    public void createBooking(Booking booking, Guest guest) {
        // a) Insert the guest (if new)
        if (!guestRepository.existsById(guest.getGuestId())) {
            guestRepository.save(guest);
        }

        // Link the guest to the booking
        booking.setGuestId(guest.getGuestId());

        // b) Insert the booking
        bookingRepository.save(booking);

        // c) Update the room status to 'Occupied'
        roomRepository.updateRoomStatus(booking.getRoomId(), "Occupied");
    }

    @Transactional
    public void checkoutGuest(String bookingId, String roomId) {
        // 1. Update the status in the bookings table to 'COMPLETED'
        jdbcTemplate.update("UPDATE bookings SET status = 'COMPLETED' WHERE booking_id = ?", bookingId);

        // 2. Update the status in the rooms table to 'Available'
        jdbcTemplate.update("UPDATE rooms SET status = 'Available' WHERE room_id = ?", roomId);
    }

    @Transactional
    public void extendBooking(String bookingId) {
        bookingRepository.extendBooking(bookingId);
    }

    @Transactional
    public void resetDatabase() {
        // Clear all transactions and customer data in relational constraint order
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM bookings");
        jdbcTemplate.update("DELETE FROM guests");
        jdbcTemplate.update("DELETE FROM rooms");

        // Seed fresh base hotel inventory
        jdbcTemplate.update(
                "INSERT INTO rooms (room_id, room_number, type_name, base_price, status) VALUES ('101', '101', 'Standard', 2500, 'Available')");
        jdbcTemplate.update(
                "INSERT INTO rooms (room_id, room_number, type_name, base_price, status) VALUES ('102', '102', 'Standard', 2500, 'Available')");
        jdbcTemplate.update(
                "INSERT INTO rooms (room_id, room_number, type_name, base_price, status) VALUES ('201', '201', 'Deluxe', 5500, 'Available')");
        jdbcTemplate.update(
                "INSERT INTO rooms (room_id, room_number, type_name, base_price, status) VALUES ('202', '202', 'Deluxe', 5500, 'Available')");
        jdbcTemplate.update(
                "INSERT INTO rooms (room_id, room_number, type_name, base_price, status) VALUES ('301', '301', 'Suite', 12000, 'Available')");
    }
}
