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
        Schema::create('node_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->string('source_node_id');
            $table->string('target_node_id');
            $table->enum('connection_type', ['success', 'failure', 'always'])->default('success');
            $table->timestamps();

            $table->index('workflow_id');
            $table->index('source_node_id');
            $table->index('target_node_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('node_connections');
    }
};
