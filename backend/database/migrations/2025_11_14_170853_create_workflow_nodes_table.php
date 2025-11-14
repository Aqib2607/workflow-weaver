<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workflow_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->string('node_id'); // Frontend-generated UUID
            $table->enum('type', ['trigger', 'action', 'condition']);
            $table->string('label');
            $table->integer('position_x');
            $table->integer('position_y');
            $table->json('config')->nullable(); // Node-specific configuration
            $table->timestamps();

            $table->index('workflow_id');
            $table->unique(['workflow_id', 'node_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_nodes');
    }
};
