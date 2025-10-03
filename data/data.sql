create database if not exists data;
create table if not exists user(
id int primary key,
email varchar(255) not null
);