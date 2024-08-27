package com.felipeguell.terraserv.api.rest.amazon;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class File {
	private byte[] content;
	private String contentType;
}
