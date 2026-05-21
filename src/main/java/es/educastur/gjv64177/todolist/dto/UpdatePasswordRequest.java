package es.educastur.gjv64177.todolist.dto;

public record UpdatePasswordRequest(
        String currentPassword,
        String newPassword
) {}
