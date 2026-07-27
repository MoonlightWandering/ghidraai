#include <stdio.h>
#include <string.h>

void process_input(const char *user_input) {
    char buffer[64];
    // VULNERABILITY: Classic buffer overflow using unsafe strcpy
    strcpy(buffer, user_input);
    printf("Processed input: %s\n", buffer);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <input_string>\n", argv[0]);
        return 1;
    }
    
    printf("Starting application...\n");
    process_input(argv[1]);
    printf("Application finished cleanly.\n");
    
    return 0;
}
