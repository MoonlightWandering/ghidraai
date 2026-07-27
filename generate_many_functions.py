import sys

with open("examples/many_functions.c", "w") as f:
    f.write("#include <stdio.h>\n#include <stdlib.h>\n\n")
    
    # Generate 50 dummy functions
    for i in range(1, 51):
        f.write(f"int dummy_func_{i}(int a, int b) {{\n")
        f.write(f"    int result = a * {i} + b / {i if i != 0 else 1};\n")
        f.write(f"    return result;\n")
        f.write("}\n\n")
        
    f.write("int main(int argc, char** argv) {\n")
    f.write("    int total = 0;\n")
    for i in range(1, 51):
        f.write(f"    total += dummy_func_{i}(argc, {i});\n")
    f.write("    printf(\"Total: %d\\n\", total);\n")
    f.write("    return 0;\n")
    f.write("}\n")
