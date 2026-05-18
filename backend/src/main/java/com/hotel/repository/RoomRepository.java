package com.hotel.repository;

import com.hotel.model.Room;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RoomRepository {

    private final JdbcTemplate jdbcTemplate;

    public RoomRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Room> rowMapper = (rs, rowNum) -> {
        Room room = new Room();
        room.setRoomId(rs.getString("room_id"));
        room.setRoomNumber(rs.getString("room_number"));
        room.setTypeName(rs.getString("type_name"));
        room.setBasePrice(rs.getBigDecimal("base_price"));
        room.setStatus(rs.getString("status"));
        return room;
    };

    public List<Room> findAllAvailableRooms() {
        String sql = "SELECT * FROM rooms WHERE UPPER(status) = 'AVAILABLE'";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public List<Room> findAllRooms() {
        String sql = "SELECT * FROM rooms ORDER BY room_number ASC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public void updateRoomStatus(String roomId, String status) {
        String sql = "UPDATE rooms SET status = ? WHERE room_id = ?";
        jdbcTemplate.update(sql, status, roomId);
    }
}
