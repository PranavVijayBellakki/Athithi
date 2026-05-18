package com.hotel;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class HotelManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelManagementApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            Integer roomCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ROOMS", Integer.class);
            if (roomCount == null || roomCount == 0) {
                System.out.println("Oracle Database: Seeding initial rooms data...");
                jdbcTemplate.update(
                        "INSERT INTO ROOMS (ROOM_ID, ROOM_NUMBER, TYPE_NAME, BASE_PRICE, STATUS) VALUES ('101', '101', 'Standard', 2500, 'Available')");
                jdbcTemplate.update(
                        "INSERT INTO ROOMS (ROOM_ID, ROOM_NUMBER, TYPE_NAME, BASE_PRICE, STATUS) VALUES ('102', '102', 'Standard', 2500, 'Available')");
                jdbcTemplate.update(
                        "INSERT INTO ROOMS (ROOM_ID, ROOM_NUMBER, TYPE_NAME, BASE_PRICE, STATUS) VALUES ('201', '201', 'Deluxe', 5500, 'Available')");
                jdbcTemplate.update(
                        "INSERT INTO ROOMS (ROOM_ID, ROOM_NUMBER, TYPE_NAME, BASE_PRICE, STATUS) VALUES ('202', '202', 'Deluxe', 5500, 'Available')");
                jdbcTemplate.update(
                        "INSERT INTO ROOMS (ROOM_ID, ROOM_NUMBER, TYPE_NAME, BASE_PRICE, STATUS) VALUES ('301', '301', 'Suite', 12000, 'Available')");
                System.out.println("Oracle Database: Seeding complete.");
            }
        };
    }
}
