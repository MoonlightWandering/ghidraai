import pyghidra
import jpype
import threading
import os
os.environ['GHIDRA_INSTALL_DIR'] = '/Users/lonely/hackathons/ghidraai/ghidra_11.4.2_PUBLIC'

print('Starting JVM in main thread...')
pyghidra.start()
print('JVM Started successfully.')

def run_extraction():
    try:
        print('In thread: Attaching JPype...')
        if jpype.isJVMStarted() and not jpype.isThreadAttachedToJVM():
            jpype.attachThreadToJVM()
        print('In thread: Opening program...')
        with pyghidra.open_program('test_binary.elf', analyze=False) as p:
            print('In thread: SUCCESS opened program')
    except Exception as e:
        print('In thread: Error:', e)

t = threading.Thread(target=run_extraction)
t.start()
t.join()
print('Main thread done.')
