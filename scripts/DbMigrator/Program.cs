using System;
using System.IO;
using Npgsql;

Console.WriteLine("Connecting to Supabase PostgreSQL database...");

var connStr = "Host=db.llkamzsucxfsundnvyze.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=dkmvtcno2L@#;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=120;";

try
{
    await using var conn = new NpgsqlConnection(connStr);
    await conn.OpenAsync();
    Console.WriteLine(" Successfully connected to Supabase database!");

    // 1. Run Schema Migration
    var schemaPath = Path.GetFullPath(@"..\..\supabase\migrations\20260930000000_initial_schema.sql");
    if (!File.Exists(schemaPath))
    {
        schemaPath = @"d:\Semester 8\TaskFlow\supabase\migrations\20260930000000_initial_schema.sql";
    }

    Console.WriteLine($"Reading schema from: {schemaPath}");
    var schemaSql = await File.ReadAllTextAsync(schemaPath);

    Console.WriteLine("Executing schema migration (18 tables, RLS policies, triggers)...");
    await using (var cmd = new NpgsqlCommand(schemaSql, conn))
    {
        await cmd.ExecuteNonQueryAsync();
    }
    Console.WriteLine(" Schema migration executed successfully!");

    // 2. Run Seed Data
    var seedPath = Path.GetFullPath(@"..\..\supabase\seed.sql");
    if (!File.Exists(seedPath))
    {
        seedPath = @"d:\Semester 8\TaskFlow\supabase\seed.sql";
    }

    Console.WriteLine($"Reading seed data from: {seedPath}");
    var seedSql = await File.ReadAllTextAsync(seedPath);

    Console.WriteLine("Executing seed data insertion...");
    await using (var cmd = new NpgsqlCommand(seedSql, conn))
    {
        await cmd.ExecuteNonQueryAsync();
    }
    Console.WriteLine(" Seed data inserted successfully!");

    // 3. Verification Queries
    Console.WriteLine("\n--- VERIFICATION STATS ---");
    
    await using (var cmd = new NpgsqlCommand("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';", conn))
    {
        var count = await cmd.ExecuteScalarAsync();
        Console.WriteLine($"Total public tables: {count}");
    }

    await using (var cmd = new NpgsqlCommand("SELECT count(*) FROM profiles;", conn))
    {
        var count = await cmd.ExecuteScalarAsync();
        Console.WriteLine($"Profiles seeded: {count}");
    }

    await using (var cmd = new NpgsqlCommand("SELECT count(*) FROM projects;", conn))
    {
        var count = await cmd.ExecuteScalarAsync();
        Console.WriteLine($"Projects seeded: {count}");
    }

    await using (var cmd = new NpgsqlCommand("SELECT count(*) FROM issues;", conn))
    {
        var count = await cmd.ExecuteScalarAsync();
        Console.WriteLine($"Issues seeded: {count}");
    }

    Console.WriteLine("\n ALL MIGRATIONS AND SEED DATA APPLIED TO SUPABASE SUCCESSFULLY!");
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"\nMigration Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner: {ex.InnerException.Message}");
    }
    Console.ResetColor();
    Environment.Exit(1);
}
