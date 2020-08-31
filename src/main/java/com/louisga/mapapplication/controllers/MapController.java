package com.louisga.mapapplication.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.louisga.mapapplication.config.MapKeysConfiguration;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MapController {

	@Value("${spring.application.name}")
	String APPLICATION_NAME;
	
    private final MapKeysConfiguration mapKeysConfiguration;

    @GetMapping("/")
    public String getMap(Model model) {

        model.addAttribute("bingKey", mapKeysConfiguration.getBingKey());
        model.addAttribute("mapboxKey", mapKeysConfiguration.getMapboxKey());
    	model.addAttribute("applicationName", APPLICATION_NAME);
        return "map.html";
    }
}