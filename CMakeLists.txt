cmake_minimum_required(VERSION 3.16)
project(blog_app CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# --- Drogon ---------------------------------------------------------------
# Homebrew 等でインストール済みの Drogon を探す。
find_package(Drogon CONFIG REQUIRED)

# --- ソース ---------------------------------------------------------------
file(GLOB_RECURSE SRC_FILES
  ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cc
)

add_executable(${PROJECT_NAME} ${SRC_FILES})

target_include_directories(${PROJECT_NAME} PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(${PROJECT_NAME} PRIVATE Drogon::Drogon)

# --- CSP ビュー -----------------------------------------------------------
# views/*.csp を drogon_ctl で C++ に変換してビルドに含める。
file(GLOB CSP_FILES ${CMAKE_CURRENT_SOURCE_DIR}/views/*.csp)
foreach(csp ${CSP_FILES})
  drogon_create_views(${PROJECT_NAME}
    ${CMAKE_CURRENT_SOURCE_DIR}/views
    ${CMAKE_CURRENT_BINARY_DIR})
  break()
endforeach()

# --- テスト ---------------------------------------------------------------
enable_testing()
add_subdirectory(tests)
