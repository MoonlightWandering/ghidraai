import sys
import json
import os
import traceback

def main():
    try:
        binary_path = sys.argv[1]
        
        import pyghidra
        pyghidra.start()
        
        from ghidra.app.decompiler import DecompInterface
        from ghidra.util.task import ConsoleTaskMonitor
        
        results = {}
        with pyghidra.open_program(binary_path, analyze=False) as flat_api:
            program = flat_api.getCurrentProgram()
            monitor = ConsoleTaskMonitor()
            ifc = DecompInterface()
            ifc.openProgram(program)

            function_manager = program.getFunctionManager()
            functions = function_manager.getFunctions(True)  # forward iterator

            count = 0
            max_functions = 50  # Limit for hackathon/performance

            for func in functions:
                if count >= max_functions:
                    break
                    
                func_name = func.getName()
                entry_addr = func.getEntryPoint().toString()

                if func.isThunk() or func.isExternal():
                    continue

                decomp_result = ifc.decompileFunction(func, 60, monitor)

                if decomp_result.decompileCompleted():
                    decomp_func = decomp_result.getDecompiledFunction()
                    c_code = decomp_func.getC() if decomp_func else ""
                else:
                    c_code = f"// Decompilation failed: {decomp_result.getErrorMessage()}"

                results[func_name] = {
                    "name": func_name,
                    "address": entry_addr,
                    "raw_code": c_code,
                    "size": len(c_code),
                    "binary": os.path.basename(binary_path),
                }
                count += 1

            ifc.dispose()
            
        print("---JSON_START---")
        print(json.dumps(results))
        print("---JSON_END---")
        
    except Exception as e:
        print("---JSON_START---")
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
        print("---JSON_END---")

if __name__ == "__main__":
    main()
