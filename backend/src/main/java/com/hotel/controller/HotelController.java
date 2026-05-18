package com.hotel.controller;

import com.hotel.model.Booking;
import com.hotel.model.Guest;
import com.hotel.model.Room;
import com.hotel.model.Payment;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotel")
@CrossOrigin(origins = "*")
public class HotelController {

    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final BookingService bookingService;
    private final PaymentRepository paymentRepository;
    private final com.hotel.repository.BookingRepository bookingRepository;

    public HotelController(RoomRepository roomRepository, GuestRepository guestRepository,
            BookingService bookingService, PaymentRepository paymentRepository,
            com.hotel.repository.BookingRepository bookingRepository) {
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.bookingService = bookingService;
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    // GET all rooms (available and occupied)
    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAllRooms());
    }

    // GET statistics
    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        int totalRooms = roomRepository.findAllRooms().size();
        int availableRooms = roomRepository.findAllAvailableRooms().size();
        return ResponseEntity.ok(new StatsResponse(totalRooms, availableRooms));
    }

    // GET all active bookings
    @GetMapping("/bookings/active")
    public ResponseEntity<List<Booking>> getActiveBookings() {
        return ResponseEntity.ok(bookingRepository.findAllActiveBookings());
    }

    // POST to reset/clear database
    @PostMapping("/reset")
    public ResponseEntity<String> resetDatabase() {
        try {
            bookingService.resetDatabase();
            return ResponseEntity.ok("Oracle Database reset and seeded successfully.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error resetting database: " + e.getMessage());
        }
    }

    // GET all available rooms
    @GetMapping("/rooms/available")
    public ResponseEntity<List<Room>> getAvailableRooms() {
        List<Room> availableRooms = roomRepository.findAllAvailableRooms();
        return ResponseEntity.ok(availableRooms);
    }

    // POST a new guest
    @PostMapping("/guests")
    public ResponseEntity<String> createGuest(@RequestBody Guest guest) {
        if (!guestRepository.existsById(guest.getGuestId())) {
            guestRepository.save(guest);
            return ResponseEntity.ok("Guest created successfully.");
        } else {
            return ResponseEntity.badRequest().body("Guest already exists.");
        }
    }

    // POST a new booking
    @PostMapping("/bookings")
    public ResponseEntity<String> createBooking(@RequestBody BookingRequest request) {
        try {
            bookingService.createBooking(request.getBooking(), request.getGuest());
            return ResponseEntity.ok("Booking created successfully. Room is now Occupied.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating booking: " + e.getMessage());
        }
    }

    // PUT to checkout a guest
    @PutMapping("/checkout")
    public ResponseEntity<String> checkout(@RequestParam String bookingId, @RequestParam String roomId) {
        try {
            bookingService.checkoutGuest(bookingId, roomId);
            return ResponseEntity.ok("Checkout successful.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error during checkout: " + e.getMessage());
        }
    }

    // PUT to extend a booking
    @PutMapping("/bookings/extend")
    public ResponseEntity<String> extendBooking(@RequestParam String bookingId) {
        try {
            bookingService.extendBooking(bookingId);
            return ResponseEntity.ok("Booking extended successfully by 1 day.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error extending booking: " + e.getMessage());
        }
    }

    // POST a new payment
    @PostMapping("/payments")
    public ResponseEntity<String> createPayment(@RequestBody Payment payment) {
        try {
            paymentRepository.save(payment);
            return ResponseEntity.ok("Payment saved successfully.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving payment: " + e.getMessage());
        }
    }
}

// Helper DTO class to accept both Booking and Guest data in a single POST
// request
class BookingRequest {
    private Booking booking;
    private Guest guest;

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Guest getGuest() {
        return guest;
    }

    public void setGuest(Guest guest) {
        this.guest = guest;
    }
}

class StatsResponse {
    private int totalRooms;
    private int availableRooms;

    public StatsResponse(int totalRooms, int availableRooms) {
        this.totalRooms = totalRooms;
        this.availableRooms = availableRooms;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }

    public int getAvailableRooms() {
        return availableRooms;
    }

    public void setAvailableRooms(int availableRooms) {
        this.availableRooms = availableRooms;
    }
}
