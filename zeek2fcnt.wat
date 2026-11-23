(module

	(import "env" "read_trailer" (func $read_trailer (param i32) (result i32)))

	(memory (export "memory") 2 )

	(func $trailer2num_frames (export "trailer2num_frames")
		(param $trailer_ptr i32) (result i32)
	  local.get 0
		i32.load
	)

	(func $io_trailer2num_frames (export "io_trailer2num_frames") (result i32)
		i32.const 0x0001_0000
		call $read_trailer
		i32.const 9
		i32.ne
		if
			i32.const -1
			return
		end

		i32.const 0x0001_0000
		call $trailer2num_frames
	)

)
