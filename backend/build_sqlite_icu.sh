gcc -fPIC -shared icu/icu.c `pkg-config --libs --cflags icu-uc icu-io` -o icu/libSqliteIcu.so