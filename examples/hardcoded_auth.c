#include <stdio.h>
#include <string.h>

int check_credentials(const char *username, const char *password) {
    // VULNERABILITY: Hardcoded credentials
    const char *secret_admin_user = "admin";
    const char *secret_admin_pass = "SuperSecretAdminPass123!";
    
    if (strcmp(username, secret_admin_user) == 0 && strcmp(password, secret_admin_pass) == 0) {
        return 1;
    }
    return 0;
}

void admin_panel() {
    printf("Welcome to the Admin Panel.\n");
    printf("Top Secret Data: The missile launch codes are 00000000.\n");
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        printf("Usage: %s <username> <password>\n", argv[0]);
        return 1;
    }
    
    if (check_credentials(argv[1], argv[2])) {
        printf("Authentication successful!\n");
        admin_panel();
    } else {
        printf("Authentication failed! Invalid username or password.\n");
    }
    
    return 0;
}
